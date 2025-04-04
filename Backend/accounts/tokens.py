from django.contrib.auth.tokens import PasswordResetTokenGenerator
import six
from datetime import timedelta

class AccountActivationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return (
            six.text_type(user.pk) + six.text_type(timestamp) +
            six.text_type(user.is_active)
        )
    
    def check_token(self, user, token):
        try:
            ts_b36, _ = token.split("-")
            ts = int(ts_b36, 36)
        except ValueError:
            return False

        now = self._now().timestamp()
        if (now - ts) > timedelta(minutes=30).total_seconds():
            return False
            
        return super().check_token(user, token)

account_activation_token = AccountActivationTokenGenerator()
